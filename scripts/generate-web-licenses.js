const checker = require('license-checker-rseidelsohn');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const outputFile = path.join(projectRoot, 'public', 'licenses.json');

console.log('Gathering licenses for web project...');

checker.init(
    {
        start: projectRoot,
        production: true,
        json: true,
        customFormat: {
            name: '',
            version: '',
            description: '',
            repository: '',
            publisher: '',
            email: '',
            url: '',
            licenses: '',
            licenseFile: '',
            licenseText: '',
            copyright: ''
        }
    },
    function (err, packages) {
        if (err) {
            console.error('Failed to get licenses:', err);
            process.exit(1);
        }

        const out = [];

        for (const [key, value] of Object.entries(packages)) {
            if (key.startsWith('recipe-keeper@')) continue;

            const nameMatch = key.match(/^(.+)@/);
            const name = nameMatch ? nameMatch[1] : key;

            out.push({
                id: key,
                name: name,
                version: value.version,
                description: value.description || '',
                repository: value.repository || value.url || '',
                publisher: value.publisher || '',
                licenses: Array.isArray(value.licenses) ? value.licenses.join(', ') : value.licenses,
                licenseText: value.licenseText || 'Standard License terms apply (Text not provided in package)',
            });
        }

        out.sort((a, b) => a.name.localeCompare(b.name));

        const publicDir = path.dirname(outputFile);
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        fs.writeFileSync(outputFile, JSON.stringify(out, null, 2));
        console.log(`Successfully generated ${out.length} licenses at ${outputFile}`);
    }
);
