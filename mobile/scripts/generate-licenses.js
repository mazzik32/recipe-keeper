const checker = require('license-checker-rseidelsohn');
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const outputFile = path.join(projectRoot, 'assets', 'licenses.json');

console.log('Gathering licenses for mobile project...');

checker.init(
    {
        start: projectRoot,
        production: true, // Only include production dependencies
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

        // Formatting the object into an array
        for (const [key, value] of Object.entries(packages)) {
            // Ignore the root project itself
            if (key.startsWith('recipekeeper.org@')) continue;

            // Extract just the package name without the version tag suffix
            // e.g., "@expo/vector-icons@14.0.0" -> "@expo/vector-icons"
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

        // Sort alphabetically by package name
        out.sort((a, b) => a.name.localeCompare(b.name));

        // Ensure assets directory exists
        const assetsDir = path.dirname(outputFile);
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }

        fs.writeFileSync(outputFile, JSON.stringify(out, null, 2));
        console.log(`Successfully generated ${out.length} licenses at ${outputFile}`);
    }
);
