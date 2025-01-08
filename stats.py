import os
from pandas_datapackage_reader import read_datapackage
import pandas as pd

pd.set_option('display.max_rows', 100000)

def update_stats():
    # Load data
    data = read_datapackage("data")
    filters = data['filters']
    filename = os.path.join('data', filters._metadata['path'])
    images = data['images']

    # Clean and prepare data
    images.fillna('', inplace=True)
    filters.dropna(subset=['Code', 'Column'], inplace=True)

    # Combine 'FoD' and 'FoP' into 'Fo' in 'Technik' and 'Techniken'
    images['Technik'] = images['Technik'].replace({'FoD': 'Fo', 'FoP': 'Fo'})
    images['Techniken'] = images['Techniken'].replace({'FoD': 'Fo', 'FoP': 'Fo'})

    # Vectorized calculation of 'Count'
    def calculate_count(code, column):
        if code == '.*':
            return images[column].str.len().gt(0).sum()
        else:
            regex = (
                f"(^| ){code}( |$|,)"  # Match whole word with boundaries
            )
            return images[column].str.contains(regex, regex=True, na=False).sum()

    filters['Count'] = filters.apply(
        lambda row: calculate_count(row['Code'], row['Column']),
        axis=1
    )

    # Save results
    print(filters.head(n=50))
    print(f"Writing to {filename}")
    filters.to_csv(filename, index=False)


if __name__ == '__main__':
    update_stats()
