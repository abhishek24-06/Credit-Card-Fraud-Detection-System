import json

with open('creditcard_fraud_detection.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

with open('extract_output.txt', 'w', encoding='utf-8') as out:
    for cell in nb['cells']:
        if cell['cell_type'] == 'code':
            source = "".join(cell['source'])
            if 'Amount' in source or 'Time' in source or 'scaler' in source or 'StandardScaler' in source or 'RobustScaler' in source:
                out.write(source + '\n' + '-'*40 + '\n')
