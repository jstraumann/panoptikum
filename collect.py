import os, csv
from csv import DictWriter

from stats import *

def list_files(dir):
    r = {}
    for root, dirs, files in os.walk(dir):
        if 'thumb' in root: continue
        dirs.sort()
        for name in files:
            fn, ext = os.path.splitext(name)
            try:
                wn = int(fn.split('_')[0].split(' ')[0].split(',')[0].strip('.+jpg'))
            except:
                print('Invalid file: %s' % os.path.join(root, name))
                continue
            r[wn] = {
                'path': os.path.join(root, name).strip('./'),
                'thumb': os.path.join(root, 'thumb', name).strip('./'),
            }
    return r

def flatten(xss):
    return [x for xs in xss for x in xs]

def normalize_title(title):
    """
    Normalize a title by removing special characters, accents, and unnecessary punctuation.
    """
    import unicodedata
    if not title:
        return ""
    # Remove accents and diacritical marks
    title = unicodedata.normalize('NFD', title).encode('ascii', 'ignore').decode('utf-8')
    # Remove special characters and punctuation
    title = title.translate(str.maketrans("", "", ".-…\"'«»“”()[]{}&"))
    # Replace ellipses with a space
    title = title.replace("...", " ").replace("…", " ")
    # Convert to lowercase
    return title.strip().lower()

def update_files(lf, filename='WERKVERZEICHNIS.csv', outputfile='images.csv'):
    with open(os.path.join('data', filename), 'r') as csvin:
        reader = csv.DictReader(csvin)
        fieldnames = reader.fieldnames

        # Ensure new columns exist
        if 'path' not in fieldnames: fieldnames.append('path')
        if 'thumb' not in fieldnames: fieldnames.append('thumb')
        if 'TitelEinfach' not in fieldnames: fieldnames.append('TitelEinfach')  # Add normalized title column

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

                # Add paths
                r['path'] = imagerow['path']
                r['thumb'] = imagerow['thumb']

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
