for file in frontend/src/pages/*.jsx; do
  sed -i 's/p-4 md:p-6 lg:p-4 md:p-6 lg:p-8/p-4 sm:p-5 lg:p-6/g' "$file"
  sed -i 's/gap-4 md:gap-6 lg:gap-4 md:gap-6/gap-3 sm:gap-4 lg:gap-6/g' "$file"
done
