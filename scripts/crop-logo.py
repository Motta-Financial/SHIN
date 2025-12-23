from PIL import Image
import io

# Open the image
img = Image.open('/dev/stdin')

# Convert to RGBA if not already
img = img.convert('RGBA')

# Get the bounding box of non-white/non-transparent pixels
# We'll find the actual content bounds
pixels = img.load()
width, height = img.size

# Find bounds
left = width
top = height
right = 0
bottom = 0

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        # Check if pixel is not white/near-white (accounting for slight variations)
        if a > 10 and (r < 250 or g < 250 or b < 250):
            if x < left:
                left = x
            if x > right:
                right = x
            if y < top:
                top = y
            if y > bottom:
                bottom = y

# Add small padding (5px)
padding = 5
left = max(0, left - padding)
top = max(0, top - padding)
right = min(width, right + padding)
bottom = min(height, bottom + padding)

# Crop the image
cropped = img.crop((left, top, right, bottom))

# Save as PNG
cropped.save('cropped-shin-logo.png', 'PNG')
print(f"Original size: {width}x{height}")
print(f"Cropped size: {right-left}x{bottom-top}")
print(f"Bounds: left={left}, top={top}, right={right}, bottom={bottom}")
