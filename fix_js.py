import os
js_path = 'c:/Users/neela/OneDrive/Desktop/maths project/maths project/app.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

if '₹{' in js:
    js = js.replace('₹{', '${')
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print('Fixed template literals in app.js')
else:
    print('No broken template literals.')
