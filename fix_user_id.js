const fs = require('fs');
const files = fs.readdirSync('src/components/forms')
  .filter(f => f.endsWith('.tsx') && f.includes('Form'))
  .map(f => `src/components/forms/${f}`);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('user_id: userId') && content.match(/const dataToSave = \{/)) {
    content = content.replace(/const dataToSave = \{/, `const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      const dataToSave = {
        user_id: userId,
        created_by: userId,
        partner_id: userId,`);
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
