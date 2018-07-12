import pandas as pd


def get_issue_count_for_company(df, start, end, company='all'):
    if company != 'all':
        df = df[df['Company'] == company]
    df = df[(df['Date received'] > start) & (df['Date received'] < end)]
    return df['Issue'].value_counts().head(10)


def get_daily_average_count_for_company(df, start, end, company='all'):
    if company != 'all':
        df = df[df['Company'] == company]
    days = (end - start).days
    df = df[(df['Date received'] > start) & (df['Date received'] < end)]
    return df['Company'].value_counts().head(10) / days


def get_product_count_per_company(df, start, end):
    df = df[(df['Date received'] > start) & (df['Date received'] < end)]
    df_list = []
    for key, grp in df.groupby('Company'):
        tdf = grp.groupby(['Product']).size().reset_index(name='Count')
        tdf = tdf.set_index('Product').T
        tdf['Company'] = key
        df_list.append(tdf)
    tdf = pd.concat(df_list, axis=0, sort=True).reset_index()
    del tdf['index']
    tdf = tdf.fillna(0)
    aggregate = {
        'Credit Card': ['Credit card', 'Credit card or prepaid card'],
        'Credit Reporting': ['Credit reporting', 'Credit reporting, credit repair services, or other personal consumer reports'],
        'Money Transfers': ['Money transfers', 'Money transfer, virtual currency, or money service'],
        'Consumer Loan': ['Payday loan', 'Payday loan, title loan, or personal loan', 'Consumer Loan', 'Vehicle loan or lease'],
        'Bank Account': ['Bank account or service', 'Checking or savings account'],
        'Other Service': ['Prepaid card', 'Other financial service', 'Money transfers']
    }
    for key, vals in aggregate.items():
        tdf['agr'] = 0
        for col in vals:
            if col in tdf.columns:
                tdf['agr'] += tdf[col]
        tdf[key] = tdf['agr']
    to_delete = [val for l in aggregate.values() for val in l]
    to_delete.append('agr')
    for key in to_delete:
        try:
            del tdf[key]
        except KeyError:
            pass
    tdf = tdf.set_index('Company')
    return tdf
