sed -i 's/className="max-w-2xl/className="w-full max-w-lg lg:max-w-2xl/g' frontend/src/pages/Login.jsx frontend/src/pages/Register.jsx frontend/src/pages/DailyCheckin.jsx
sed -i 's/className="max-w-4xl/className="w-full max-w-full lg:max-w-4xl/g' frontend/src/pages/DFUScan.jsx
sed -i 's/grid md:grid-cols-2/grid grid-cols-1 md:grid-cols-2/g' frontend/src/pages/*.jsx
sed -i 's/className="space-y-6/className="space-y-4/g' frontend/src/pages/*.jsx
sed -i 's/className="space-y-4/className="space-y-3/g' frontend/src/pages/*.jsx
sed -i 's/py-12/py-6 md:py-8 lg:py-12/g' frontend/src/pages/*.jsx
sed -i 's/p-8/p-4 md:p-6 lg:p-8/g' frontend/src/pages/Results.jsx frontend/src/pages/DFUScan.jsx frontend/src/pages/DailyCheckin.jsx frontend/src/pages/Dashboard.jsx
sed -i 's/gap-6/gap-4 md:gap-6/g' frontend/src/pages/*.jsx
