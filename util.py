import re

def regex_filter(regex, val):
    if val:
        mo = re.search(regex,val)
        if mo:
            return True
        return False
    return False


def get_random(dp_werke):
    df = dp_werke.copy()
    return df.sample(30).to_json(orient='records')

def get_paginated(args, dp_werke, as_json=False):
    df = dp_werke.copy()
    for f in df:
        val = args.get('o_' + f, None)
        if val is not None:
            df = df.dropna(subset=[f])
            dfname = df[f].dtype.name.lower()
            if 'object' in dfname:
                # Handling both 'AND' (split by ',') and 'OR' (split by '|') conditions
                and_conditions = val.split(',')
                for and_cond in and_conditions:
                    or_conditions = and_cond.split('|')
                    regex_patterns = [
                        f"(?<![a-zA-ZäöüÄÖÜ0-9]){re.escape(option)}(?![a-zA-ZäöüÄÖÜ0-9])" 
                        for option in or_conditions
                    ]
                    # Combine options into a single regex pattern with OR conditions
                    or_regex = f"({'|'.join(regex_patterns)})"
                    # Apply this 'OR' pattern to the DataFrame and continue filtering on the result
                    df = df.loc[df[f].str.contains(or_regex, regex=True, case=False, na=False)]
            elif 'int' in dfname:
                try:
                    int_conditions = map(int, and_conditions)  # Convert all to integers
                    df = df[df[f].isin(int_conditions)]
                except ValueError:
                    pass

    with_sort = args.get('sort', None)
    if with_sort is not None:
        is_asc = True
        if with_sort.startswith('-'):
            with_sort = with_sort.strip('-')
            is_asc = False
        df = df.sort_values(with_sort, ascending=is_asc)

    page = int(args.get('page', 1))
    per_page = int(args.get('per_page', 10))
    total = len(df)
    pages = round(total / per_page)
    offset = (page - 1) * per_page
    dprange = df[offset: offset + per_page]

    if as_json:
        return dprange.to_json(orient='records')
    return {
        'page': page, 'pages': pages, 'total': total
    }
