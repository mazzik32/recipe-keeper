const fs = require('fs');
const file = 'mobile/app/recipes/recipe-form.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`    const [categoryId, setCategoryId] = useState<string | null>(scannedData?.category_id || null);
    const [categories, setCategories] = useState<any[]>([]);`,
`    const [categoryId, setCategoryId] = useState<string | null>(scannedData?.category_id || null);
    const [categories, setCategories] = useState<any[]>([]);
    const [collectionId, setCollectionId] = useState<string | null>(scannedData?.collection_id || null);
    const [collections, setCollections] = useState<any[]>([]);`
);

content = content.replace(
`    useEffect(() => {
        async function fetchCategories() {
            const { data } = await supabase.from("categories").select("*").order("name");
            if (data) setCategories(data);
        }
        fetchCategories();`,
`    useEffect(() => {
        async function fetchDropdowns() {
            const { data: cats } = await supabase.from("categories").select("*").order("name");
            if (cats) setCategories(cats);
            
            if (user) {
                const { data: cols } = await supabase.from("collections").select("*").eq("user_id", user.id).order("name");
                if (cols) setCollections(cols);
            }
        }
        fetchDropdowns();`
);

content = content.replace(
`            setCategoryId(data.category_id || null);`,
`            setCategoryId(data.category_id || null);
            setCollectionId(data.collection_id || null);`
);

content = content.replace(
`                        difficulty: recipeMetadata?.difficulty || null,
                        category_id: categoryId,
                    })`,
`                        difficulty: recipeMetadata?.difficulty || null,
                        category_id: categoryId,
                        collection_id: collectionId,
                    })`
);

content = content.replace(
`                        difficulty: scannedData?.difficulty || null,
                        category_id: categoryId,`,
`                        difficulty: scannedData?.difficulty || null,
                        category_id: categoryId,
                        collection_id: collectionId,`
);

const uiAdditions = `                {/* Collections */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">{(t.recipes as any).collection || "Collection"}</Text>
                    <View className="bg-white border border-warm-gray-200 rounded-xl overflow-hidden">
                        <Picker
                            selectedValue={collectionId}
                            onValueChange={(itemValue) => setCollectionId(itemValue)}
                        >
                            <Picker.Item label="Uncategorized / No Collection" value={null} />
                            {collections.map((col) => (
                                <Picker.Item key={col.id} label={col.name} value={col.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Categories */}`;

content = content.replace(
`                {/* Categories */}`, uiAdditions);

fs.writeFileSync(file, content);
console.log('done');
