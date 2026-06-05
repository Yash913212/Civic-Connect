from PIL import Image
import math

def distance(c1, c2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(c1, c2)))

img = Image.open('public/logo.png').convert('RGBA')
data = img.getdata()

new_data = []
for item in data:
    # item is (R, G, B, A)
    r, g, b, a = item
    
    # White background -> transparent
    # Distance to white (255, 255, 255)
    dist_white = distance((r, g, b), (255, 255, 255))
    
    # Dark text -> white
    # Distance to black (0, 0, 0)
    dist_black = distance((r, g, b), (0, 0, 0))
    
    # The text is dark blue/black. Let's say if it's very dark (r,g,b all < 50)
    # The logo has some dark blue #0c2049 maybe?
    # Let's just make near-white transparent.
    if dist_white < 60:
        # Fade alpha based on distance to white to handle anti-aliasing
        # If dist=0, alpha=0. If dist=60, alpha=255.
        alpha = int((dist_white / 60.0) * 255)
        # But wait, blending with dark background: we want to remove the white contribution.
        # Actually, simpler: if it's close to white, just drop alpha.
        new_data.append((r, g, b, 0 if dist_white < 20 else alpha))
    else:
        # Check if it's dark text. If so, lighten it.
        # Let's say if r<60 and g<60 and b<100, we make it white or light grey.
        # Let's leave colors intact.
        if r < 50 and g < 50 and b < 80:
            # Change to white
            new_data.append((255, 255, 255, a))
        else:
            new_data.append(item)

img.putdata(new_data)
img.save('public/logo_dark.png')
print("Processed logo_dark.png")
