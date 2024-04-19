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
                # Splitting the values on comma, assuming each can be a complex expression involving 'OR' (|)
                terms = val.split(',')
                regex_patterns = []
                for term in terms:
                    # Each term could contain multiple options separated by '|', handle each as part of an overall pattern
                    options = term.split('|')
                    # Construct regex for each option and ensure each is independently surrounded by lookbehind and lookahead
                    options_regex = [
                        f"(?<![a-zA-ZäöüÄÖÜ0-9]){re.escape(option)}(?![a-zA-ZäöüÄÖÜ0-9])" 
                        for option in options
                    ]
                    # Combine options into a single regex pattern with OR conditions
                    regex_pattern = f"({'|'.join(options_regex)})"
                    regex_patterns.append(regex_pattern)
                # Combine all regex patterns into one; since each is a complete regex, join with OR
                final_regex = f"({'|'.join(regex_patterns)})"
                df = df.loc[df[f].str.contains(final_regex, regex=True, case=False, na=False)]
            elif 'int' in dfname:
                try:
                    val = int(val)
                    df = df[df[f] == val]
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
    dprange = df[offset : offset + per_page]
    if as_json:
        return dprange.to_json(orient='records')
    return {
        # 'items': dprange.to_dict(orient='records'),
        'page': page, 'pages': pages, 'total': total,
        # 'has_next': ppp.has_next, 'has_prev': ppp.has_prev
    }
