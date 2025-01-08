import os
import csv
from csv import DictWriter
from PIL import Image, ImageStat  # For image analysis
from stats import *


def list_files(dir):
    r = {}
    all_files = []
    for root, dirs, files in os.walk(dir):
        if 'thumb' in root:
            continue
        dirs.sort()
        for name in files:
            if not name.startswith('.'):  # Skip hidden files like .DS_Store
                all_files.append(os.path.join(root, name))

    total_files = len(all_files)
    print(f"Found {total_files} files to process.")

    for index, file_path in enumerate(all_files, start=1):
        root, name = os.path.split(file_path)
        fn, ext = os.path.splitext(name)
        try:
            wn = int(fn.split('_')[0].split(' ')[0].split(',')[0].strip('.+jpg'))
        except:
            print(f"Invalid file: {file_path}")
            continue
        try:
            brightness = calculate_brightness(file_path)
            hue = calculate_hue(file_path)
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            brightness = None
            hue = None

        r[wn] = {
            'path': file_path.strip('./'),
            'thumb': os.path.join(root, 'thumb', name).strip('./'),
            'brightness': brightness,
            'hue': hue
        }

        # Print progress
        progress = (index / total_files) * 100
        print(f"Processed {index}/{total_files} files ({progress:.2f}%)", end="\r")

    print("\n--- File processing complete ---")
    return r

def calculate_brightness(image_path):
    """
    Calculate the average brightness of an image.
    Brightness is computed as the mean of grayscale pixel values,
    normalized to a scale from 0 to 100 and rounded to the nearest integer.
    """
    with Image.open(image_path) as img:
        img = img.convert("L")  # Convert image to grayscale
        stat = ImageStat.Stat(img)
        normalized_brightness = (stat.mean[0] / 255) * 100  # Normalize to 0-100
        return round(normalized_brightness)

def calculate_hue(image_path):
    """
    Calculate the average hue of an image.
    Hue is computed in the HSV color space,
    rounded to the nearest integer.
    """
    with Image.open(image_path) as img:
        img = img.convert("RGB")  # Ensure the image is in RGB mode
        img = img.convert("HSV")  # Convert to HSV
        hue_values = [pixel[0] for pixel in img.getdata()]  # Extract the hue channel
        return round(sum(hue_values) / len(hue_values))  # Rounded average hue

def flatten(xss):
    return [x for xs in xss for x in xs]

def normalize_title(title):
    import unicodedata
    if not title:
        return ""
    title = unicodedata.normalize('NFD', title).encode('ascii', 'ignore').decode('utf-8')
    title = title.translate(str.maketrans("", "", ".-…\"'«»“”()[]{}&"))
    title = title.replace("...", " ").replace("…", " ")
    return title.strip().lower()

def update_files(lf, filename='WERKVERZEICHNIS.csv', outputfile='images.csv'):
    with open(os.path.join('data', filename), 'r') as csvin:
        reader = csv.DictReader(csvin)
        fieldnames = reader.fieldnames

        # Ensure new columns exist
        if 'path' not in fieldnames: fieldnames.append('path')
        if 'thumb' not in fieldnames: fieldnames.append('thumb')
        if 'TitelEinfach' not in fieldnames: fieldnames.append('TitelEinfach')  # Add normalized title column
        if 'brightness' not in fieldnames: fieldnames.append('brightness')  # Add brightness column
        if 'hue' not in fieldnames: fieldnames.append('hue')  # Add hue column

        fieldnames.append('Techniken')
        fieldnames.append('Motiven')
        fieldnames.append('Darstellungsformen')

        outputpath = os.path.join('data', outputfile)
        print("Writing to %s" % outputpath)

        with open(outputpath, 'w+') as csvout:
            writer = csv.DictWriter(csvout, fieldnames=fieldnames,
                                     delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()

            print('Scanning images, showing any missing below:')
            for r in reader:
                try:
                    imagerow = lf[int(r['Nummer'])]
                except:
                    print(r['Nummer'], end=' ')
                    continue

                # Add paths and brightness
                r['path'] = imagerow['path']
                r['thumb'] = imagerow['thumb']
                r['brightness'] = imagerow['brightness']
                r['hue'] = imagerow['hue']

                # Add normalized title
                if 'Titel' in r:
                    r['TitelEinfach'] = normalize_title(r['Titel'])

                # Process other fields
                r['Techniken'] = ' '.join([
                    r['Technik'],
                    r['Technik I'],
                    r['Technik II'],
                    r['Technik III'],
                    r['Technik IV'],
                ])

                r['Technik'] = r['Technik'].replace('FoD', 'Fo').replace('FoP', 'Fo')

                r['Motiven'] = ' '.join(flatten([
                    r['Motiv I'].split(", "),
                    r['Motiv II'].split(", "),
                    r['Motiv III'].split(", "),
                    r['Motiv IV'].split(", "),
                ]))

                r['Darstellungsformen'] = ' '.join([
                    r['Darstellungsform'],
                    r['Darstellungsform I'],
                ])

                r['Jahr'] = r['Jahr'].strip().strip('a')

                writer.writerow(r)

            print("--- Done.")

if __name__ == '__main__':
    lf = list_files('images')
    update_files(lf)
    update_stats()
