import re
import unicodedata
import pandas as pd

def get_random(dp_werke):
    df = dp_werke.copy()
    return df.sample(30).to_json(orient='records')

def get_paginated(args, dp_werke, as_json=False):
    df = dp_werke.copy()
    df = filter_columns(df, args)
    df = sort_data(df, args)
    dprange, pagination_info = paginate_data(df, args)

    if as_json:
        return dprange.to_json(orient='records')
    return pagination_info

def filter_columns(df, args):
    for f in df.columns:
        val = args.get('o_' + f, None)
        if val is not None:
            if f == "Zus'arbeit":
                # Special handling for "Zus'arbeit" field to match non-empty values
                df = df[df[f].notna() & df[f].str.strip().astype(bool)]
            else:
                df = df.dropna(subset=[f])
                dfname = df[f].dtype.name.lower()
                and_conditions = val.split(',')

                if 'object' in dfname:
                    for and_cond in and_conditions:
                        or_conditions = and_cond.split('|')

                        # Check if the field being searched is 'Titel'
                        search_field = f
                        if f == "Titel":
                            # Use 'TitelEinfach' for searching
                            search_field = "TitelEinfach"

                            # Normalize search strings in the same way as 'TitelEinfach'
                            def normalize_search_string(s):
                                return ''.join(
                                    c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn'
                                ).replace('...', '').replace('-', '').replace('…', '').replace('«', '').replace('»', '').replace('"', '').lower()

                            regex_patterns = [re.escape(normalize_search_string(option)) for option in or_conditions]

                        else:
                            # Strict word-boundary matches for other fields
                            regex_patterns = [
                                f"(?<![a-zA-ZäöüÄÖÜ0-9]){re.escape(option)}(?![a-zA-ZäöüÄÖÜ0-9])"
                                for option in or_conditions
                            ]

                        # Join conditions into a single regex
                        or_regex = f"({'|'.join(regex_patterns)})"

                        # Apply the filtering on the correct field
                        df = df.loc[df[search_field].str.contains(or_regex, regex=True, case=False, na=False)]

                elif 'int' in dfname:
                    try:
                        int_conditions = map(int, and_conditions)
                        df = df[df[f].isin(int_conditions)]
                    except ValueError:
                        pass
    return df

def sort_data(df, args):
    with_sort = args.get('sort', None)
    if with_sort is not None:
        is_asc = True
        if with_sort.startswith('-'):
            with_sort = with_sort.strip('-')
            is_asc = False
        df = df.sort_values(with_sort, ascending=is_asc)
    return df

def paginate_data(df, args):
    page = int(args.get('page', 1))
    per_page = int(args.get('per_page', 10))
    total = len(df)
    pages = -(-total // per_page)  # Calculate total pages
    offset = (page - 1) * per_page
    dprange = df[offset: offset + per_page]
    return dprange, {'page': page, 'pages': pages, 'total': total}

def convert_to_json(df, as_json):
    if as_json:
        return df.to_json(orient='records')
    return df
