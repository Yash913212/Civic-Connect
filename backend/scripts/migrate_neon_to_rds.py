import os
import getpass
from urllib.parse import quote_plus

from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import Base
from app.database.models import (
    User,
    Complaint,
    Department,
    Notification,
    Badge,
    UserBadge,
)


# ============================================================
# CONFIGURATION
# ============================================================

RDS_HOST = "nagara-netra-db.cmrkmwm8go51.us-east-1.rds.amazonaws.com"
RDS_PORT = 5432
RDS_USER = "nagara_admin"
RDS_DATABASE = "nagara_netra"

SOURCE_DATABASE_URL = settings.DATABASE_URL


# ============================================================
# TABLE ORDER
# ============================================================

# Parent tables first, then tables containing foreign keys.
TABLES = [
    User,
    Department,
    Badge,
    Complaint,
    Notification,
    UserBadge,
]


# ============================================================
# CONNECTIONS
# ============================================================

def create_source_engine():
    print("Connecting to Neon...")
    return create_engine(
        SOURCE_DATABASE_URL,
        pool_pre_ping=True
    )


def create_rds_engine():
    password = getpass.getpass("Enter RDS master password: ")

    encoded_password = quote_plus(password)

    rds_url = (
        f"postgresql://{RDS_USER}:{encoded_password}"
        f"@{RDS_HOST}:{RDS_PORT}/{RDS_DATABASE}"
        f"?sslmode=require"
    )
    print("Connecting to Amazon RDS...")

    return create_engine(
        rds_url,
        pool_pre_ping=True
    )


# ============================================================
# TEST CONNECTIONS
# ============================================================

def test_connection(engine, name):
    try:
        with engine.connect() as connection:
            connection.execute(select(1))

        print(f"✓ {name} connection successful")

    except Exception as e:
        print(f"✗ {name} connection failed:")
        print(e)
        raise


# ============================================================
# CREATE RDS SCHEMA
# ============================================================

def create_schema(rds_engine):
    print("\nCreating RDS schema...")

    Base.metadata.create_all(rds_engine)

    print("✓ RDS schema created successfully")


# ============================================================
# CHECK TARGET IS EMPTY
# ============================================================

def check_rds_empty(rds_engine):

    print("\nChecking RDS database...")

    with Session(rds_engine) as session:

        for model in TABLES:
            count = session.execute(
                select(func.count()).select_from(model)
            ).scalar_one()

            print(f"  {model.__tablename__}: {count}")

            if count != 0:
                raise RuntimeError(
                    f"RDS table '{model.__tablename__}' is not empty. "
                    "Migration stopped to prevent duplicate data."
                )

    print("✓ RDS database is empty and ready")


# ============================================================
# COPY DATA
# ============================================================

def copy_table(source_session, target_session, model):

    table_name = model.__tablename__

    print(f"\nMigrating {table_name}...")

    rows = source_session.execute(
        select(model)
    ).scalars().all()

    print(f"  Found {len(rows)} records in Neon")

    if not rows:
        return 0

    table = model.__table__

    records = []

    for row in rows:

        record = {}

        for column in table.columns:
            record[column.name] = getattr(row, column.name)

        records.append(record)

    target_session.execute(
        table.insert(),
        records
    )

    target_session.flush()

    print(f"  ✓ Copied {len(records)} records")

    return len(records)


# ============================================================
# VERIFY
# ============================================================

def verify_migration(
    source_engine,
    target_engine
):

    print("\n")
    print("=" * 60)
    print("VERIFYING MIGRATION")
    print("=" * 60)

    with Session(source_engine) as source_session, \
         Session(target_engine) as target_session:

        all_match = True

        for model in TABLES:

            table_name = model.__tablename__

            source_count = source_session.execute(
                select(func.count()).select_from(model)
            ).scalar_one()

            target_count = target_session.execute(
                select(func.count()).select_from(model)
            ).scalar_one()

            status = "✓ MATCH" if source_count == target_count else "✗ MISMATCH"

            print(
                f"{table_name:15} "
                f"Neon={source_count:<5} "
                f"RDS={target_count:<5} "
                f"{status}"
            )

            if source_count != target_count:
                all_match = False

        print()

        if all_match:
            print("✓ ALL TABLE COUNTS MATCH")
        else:
            print("✗ MIGRATION VERIFICATION FAILED")

        return all_match


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("NEON → AMAZON RDS MIGRATION")
    print("=" * 60)

    source_engine = None
    rds_engine = None

    try:

        # ----------------------------------------------------
        # Connect
        # ----------------------------------------------------

        source_engine = create_source_engine()
        rds_engine = create_rds_engine()

        test_connection(source_engine, "Neon")
        test_connection(rds_engine, "Amazon RDS")

        # ----------------------------------------------------
        # Create schema
        # ----------------------------------------------------

        create_schema(rds_engine)

        # ----------------------------------------------------
        # Make sure target is empty
        # ----------------------------------------------------

        check_rds_empty(rds_engine)

        # ----------------------------------------------------
        # Copy data
        # ----------------------------------------------------

        print("\nStarting data migration...")
        print("-" * 60)

        with Session(source_engine) as source_session, \
             Session(rds_engine) as target_session:

            try:

                total = 0

                for model in TABLES:

                    total += copy_table(
                        source_session,
                        target_session,
                        model
                    )

                target_session.commit()

                print("-" * 60)
                print(f"✓ Migration completed: {total} records copied")

            except Exception:

                target_session.rollback()
                raise

        # ----------------------------------------------------
        # Verify
        # ----------------------------------------------------

        success = verify_migration(
            source_engine,
            rds_engine
        )

        if not success:
            raise RuntimeError(
                "Migration finished but verification failed."
            )

        print("\n")
        print("=" * 60)
        print("✓ MIGRATION SUCCESSFUL")
        print("=" * 60)

        print("\nYour Neon database has NOT been modified.")
        print("Your RDS database now contains the migrated data.")
        print("\nDo NOT change DATABASE_URL yet.")

    except Exception as e:

        print("\n")
        print("=" * 60)
        print("✗ MIGRATION FAILED")
        print("=" * 60)

        print(e)

        raise

    finally:

        if source_engine:
            source_engine.dispose()

        if rds_engine:
            rds_engine.dispose()


if __name__ == "__main__":
    main()
