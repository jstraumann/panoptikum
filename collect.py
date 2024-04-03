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

def update_files(lf, filename='WERKVERZEICHNIS.csv', outputfile='images.csv'):
    with open(os.path.join('data',filename), 'r') as csvin:

        reader = csv.DictReader(csvin)
        fieldnames = reader.fieldnames

        if not 'path' in fieldnames: fieldnames.append('path')
        if not 'thumb' in fieldnames: fieldnames.append('thumb')

        fieldnames.append('Techniken')
        fieldnames.append('Motiven')
        fieldnames.append('Darstellungsformen')

        outputpath = os.path.join('data',outputfile)
        
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

                r['path'] = imagerow['path']
                r['thumb'] = imagerow['thumb']

                # Title cleaning logic here
                # if 'Titel' in r:
                #     title = r['Titel']
                #     # Check if the title is encased in double quotes
                #     if title.startswith('"') and title.endswith('"'):
                #         # Remove the outermost quotes
                #         title = title[1:-1]
                #     # Replace escaped double quotes with single quotes
                #     title = title.replace('""', '"')
                #     # Continue with other replacements
                #     title = (title
                #             .replace('«', '').replace('»', '')  # Removes guillemets
                #             .replace('“', '').replace('”', '')  # Removes curly double quotes
                #             .replace('"', '')  # Removes curly double quotes
                #             .replace("...", "…")  # Replaces three consecutive dots with an ellipsis
                #             .strip())
                #     r['Titel'] = title

                r['Techniken'] = ' '.join([
                    r['Technik'],
                    r['Technik I'],
                    r['Technik II'],
                    r['Technik III'],
                    r['Technik IV'],
                ])

                # Combine FoD and FoP into Fo
                r['Technik'] = r['Technik'].replace('FoD', 'Fo')
                r['Technik'] = r['Technik'].replace('FoP', 'Fo')

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
