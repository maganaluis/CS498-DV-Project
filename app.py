from flask import Flask
from flask import request
from flask import render_template
from wrangle import get_product_count_per_company
from wrangle import get_issue_count_for_company
from wrangle import get_daily_average_count_for_company
import pandas as pd
import datetime
import json

df = pd.read_csv('Consumer_Complaints.csv')
df['Date received'] = pd.to_datetime(df['Date received'], format='%Y-%m-%d')
df = df.sort_values(by='Date received')


def wrangle_donutchart_data(series, type):
    out = {}
    data = []
    total = 0
    for key, val in series.to_dict().items():
        data.append({'cat': key, 'val': val})
        total += val
    out['data'] = data
    out['total'] = total
    out['type'] = type
    out['unit'] = 'Cnts'
    return out


app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_stackedbar_data', methods=['POST', 'GET'])
def get_stackedbar_data():
    data = json.loads(request.data.decode("utf-8"))
    start = datetime.datetime.strptime(data['start'], '%Y-%m-%d')
    end = datetime.datetime.strptime(data['end'], '%Y-%m-%d')
    diff = (end - start).days
    if diff < 30:
        end = end + datetime.timedelta(30 - diff)
    tdf = get_product_count_per_company(df, start, end)
    tdf = tdf.reset_index()
    chart_data = tdf.to_dict(orient='records')
    return json.dumps(chart_data, indent=2)


@app.route('/get_donutchart_data', methods=['POST', 'GET'])
def get_donutchart_data():
    data = json.loads(request.data.decode("utf-8"))
    start = datetime.datetime.strptime(data['start'], '%Y-%m-%d')
    end = datetime.datetime.strptime(data['end'], '%Y-%m-%d')
    diff = (end - start).days
    if diff < 30:
        end = end + datetime.timedelta(30 - diff)
    chart_data = []
    sr = get_issue_count_for_company(df, start, end)
    chart_data.append(wrangle_donutchart_data(sr, 'Issue Count'))
    sr = get_daily_average_count_for_company(df, start, end)
    chart_data.append(wrangle_donutchart_data(sr, 'Company Daily Average'))
    return json.dumps(chart_data)


if __name__ == '__main__':
    app.run(host='10.0.0.27', port=5000)
    # app.run(host='0.0.0.0', port=5000)
