const fs = require('fs');
const file = 'mobile/app/recipes/recipe-form.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
`import { RecipeTagsInput, Tag } from "../../components/RecipeTagsInput";`,
`import { RecipeTagsInput, Tag } from "../../components/RecipeTagsInput";
import { ImageUpload, uploadImageToSupabase } from "../../components/ImageUpload";
import { Picker } from '@react-native-picker/picker';`
);

content = content.replace(
`    const [loading, setLoading] = useState(isEdit);
    const [originalImageUrls, setOriginalImageUrls] = useState<string[]>(
        scannedData?.originalImageUrls || (scannedData?.originalImageUrl ? [scannedData.originalImageUrl] : [])
    );
    const [recipeMetadata, setRecipeMetadata] = useState<any>(null);
    const [tags, setTags] = useState<Tag[]>([]);`,
`    const [loading, setLoading] = useState(isEdit);
    const [primaryImage, setPrimaryImage] = useState<string | null>(scannedData?.originalImageUrls?.[0] || scannedData?.originalImageUrl || null);
    const [secondaryImage, setSecondaryImage] = useState<string | null>(scannedData?.originalImageUrls?.[1] || null);
    const [categoryId, setCategoryId] = useState<string | null>(scannedData?.category_id || null);
    const [categories, setCategories] = useState<any[]>([]);
    const [recipeMetadata, setRecipeMetadata] = useState<any>(null);
    const [tags, setTags] = useState<Tag[]>([]);`
);

content = content.replace(
`    useEffect(() => {
        if (!isEdit || !id) return;`,
`    useEffect(() => {
        async function fetchCategories() {
            const { data } = await supabase.from("categories").select("*").order("name");
            if (data) setCategories(data);
        }
        fetchCategories();
        
        if (!isEdit || !id) return;`
);

content = content.replace(
`            setOriginalImageUrls(data.images?.map((img: any) => img.image_url) || []);`,
`            setPrimaryImage(data.images?.find((img: any) => img.is_primary)?.image_url || null);
            setSecondaryImage(data.images?.find((img: any) => !img.is_primary)?.image_url || null);
            setCategoryId(data.category_id || null);`
);

content = content.replace(
`        setInstructions(prev => [...prev, { instruction: "" }]);`,
`        setInstructions(prev => [...prev, { instruction: "", image_url: null }]);`
);

content = content.replace(
`    const updateInstruction = (index: number, value: string) => {
        setInstructions(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], instruction: value };
            return updated;
        });
    };`,
`    const updateInstruction = (index: number, field: string, value: string | null) => {
        setInstructions(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };`
);

content = content.replace(
`                    .update({
                        title,
                        description,
                        prep_time_minutes: recipeMetadata?.prep_time_minutes || null,
                        cook_time_minutes: recipeMetadata?.cook_time_minutes || null,
                        servings: recipeMetadata?.servings || null,
                        difficulty: recipeMetadata?.difficulty || null,
                    })`,
`                    .update({
                        title,
                        description,
                        prep_time_minutes: recipeMetadata?.prep_time_minutes || null,
                        cook_time_minutes: recipeMetadata?.cook_time_minutes || null,
                        servings: recipeMetadata?.servings || null,
                        difficulty: recipeMetadata?.difficulty || null,
                        category_id: categoryId,
                    })`
);

content = content.replace(
`                    .insert({
                        user_id: user?.id,
                        title,
                        description,
                        prep_time_minutes: scannedData?.prepTimeMinutes || null,
                        cook_time_minutes: scannedData?.cookTimeMinutes || null,
                        servings: scannedData?.servings || null,
                        difficulty: scannedData?.difficulty || null,
                        is_favorite: false,
                        is_archived: false,
                    })`,
`                    .insert({
                        user_id: user?.id,
                        title,
                        description,
                        prep_time_minutes: scannedData?.prepTimeMinutes || null,
                        cook_time_minutes: scannedData?.cookTimeMinutes || null,
                        servings: scannedData?.servings || null,
                        difficulty: scannedData?.difficulty || null,
                        category_id: categoryId,
                        is_favorite: false,
                        is_archived: false,
                    })`
);

const saveImageUploadsLogic = `
                let finalPrimary = primaryImage;
                let finalSecondary = secondaryImage;
                if (primaryImage && !primaryImage.startsWith("http") && user?.id) {
                    finalPrimary = await uploadImageToSupabase(primaryImage, "recipe-images", "primary", user.id);
                }
                if (secondaryImage && !secondaryImage.startsWith("http") && user?.id) {
                    finalSecondary = await uploadImageToSupabase(secondaryImage, "recipe-images", "secondary", user.id);
                }
                const finalInstructions = await Promise.all(instructions.map(async (inst) => {
                    let finalStepImg = inst.image_url;
                    if (finalStepImg && !finalStepImg.startsWith("http") && user?.id) {
                        finalStepImg = await uploadImageToSupabase(finalStepImg, "step-images", "steps", user.id);
                    }
                    return { ...inst, image_url: finalStepImg };
                }));
`;

content = content.replace(
`                // Delete old instructions and re-insert
                await supabase.from("recipe_steps").delete().eq("recipe_id", id);
                if (instructions.length > 0) {
                    const mappedInstructions = instructions.map((inst, idx) => ({
                        recipe_id: id,
                        step_number: idx + 1,
                        instruction: inst.instruction,
                    }));`,
`                ${saveImageUploadsLogic}
                // Delete old instructions and re-insert
                await supabase.from("recipe_steps").delete().eq("recipe_id", id);
                if (finalInstructions.length > 0) {
                    const mappedInstructions = finalInstructions.map((inst, idx) => ({
                        recipe_id: id,
                        step_number: idx + 1,
                        instruction: inst.instruction,
                        image_url: inst.image_url,
                    }));`
);

content = content.replace(
`                // Insert instructions
                if (instructions.length > 0) {
                    const mappedInstructions = instructions.map((inst, idx) => ({
                        recipe_id: newRecipe.id,
                        step_number: idx + 1,
                        instruction: inst.instruction,
                    }));`,
`                ${saveImageUploadsLogic}
                // Insert instructions
                if (finalInstructions.length > 0) {
                    const mappedInstructions = finalInstructions.map((inst, idx) => ({
                        recipe_id: newRecipe.id,
                        step_number: idx + 1,
                        instruction: inst.instruction,
                        image_url: inst.image_url,
                    }));`
);

const saveImagesLogic = `
                // Link uploaded images
                await supabase.from("recipe_images").delete().eq("recipe_id", recipeIdToLink);
                const imagesToInsert = [];
                if (finalPrimary) {
                    imagesToInsert.push({ recipe_id: recipeIdToLink, image_url: finalPrimary, is_primary: true });
                }
                if (finalSecondary) {
                    imagesToInsert.push({ recipe_id: recipeIdToLink, image_url: finalSecondary, is_primary: false });
                }
                if (imagesToInsert.length > 0) {
                    await supabase.from("recipe_images").insert(imagesToInsert);
                }
`;

content = content.replace(
`                // Link uploaded images if any
                if (originalImageUrls.length > 0) {
                    const imageRows = originalImageUrls.map((url: string, idx: number) => ({
                        recipe_id: newRecipe.id,
                        image_url: url,
                        is_primary: idx === 0,
                    }));
                    await supabase.from("recipe_images").insert(imageRows);
                }`,
`                const recipeIdToLink = newRecipe.id;
${saveImagesLogic}`
);

// also for edit mode, wait, there is no originalImageUrls insertion in edit mode in the current file!
// Let's add it before tags linking in edit mode too.
content = content.replace(
`                // Delete old tags and re-insert
                await supabase.from("recipe_tags").delete().eq("recipe_id", id);`,
`                const recipeIdToLink = id;
${saveImagesLogic}
                // Delete old tags and re-insert
                await supabase.from("recipe_tags").delete().eq("recipe_id", id);`
);

const uiAdditions = `                {/* Categories */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.category || "Category"}</Text>
                    <View className="bg-white border border-warm-gray-200 rounded-xl overflow-hidden">
                        <Picker
                            selectedValue={categoryId}
                            onValueChange={(itemValue) => setCategoryId(itemValue)}
                        >
                            <Picker.Item label="Select a category" value={null} />
                            {categories.map((cat) => (
                                <Picker.Item key={cat.id} label={\`\${cat.icon} \${cat.name}\`} value={cat.id} />
                            ))}
                        </Picker>
                    </View>
                </View>

                {/* Photos */}
                <View className="mb-6">
                    <Text className="text-warm-gray-500 font-semibold mb-2 uppercase text-xs tracking-wider">{t.recipes.recipePhotos || "Photos"}</Text>
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <ImageUpload
                                value={primaryImage}
                                onChange={setPrimaryImage}
                                label="Primary Photo"
                                aspectRatio="square"
                            />
                        </View>
                        <View className="flex-1">
                            <ImageUpload
                                value={secondaryImage}
                                onChange={setSecondaryImage}
                                label="Secondary Photo (Optional)"
                                aspectRatio="square"
                            />
                        </View>
                    </View>
                </View>
`;

content = content.replace(
`                {/* Tags */}
                <View className="mb-6">`,
`${uiAdditions}
                {/* Tags */}
                <View className="mb-6">`
);

content = content.replace(
`                                    <TextInput
                                        value={step.instruction}
                                        onChangeText={(v) => updateInstruction(idx, v)}
                                        multiline
                                        placeholder={t.add.instruction}
                                        className="flex-1 text-warm-gray-600 text-base leading-relaxed min-h-[60px]"
                                    />`,
`                                    <View className="flex-1">
                                        <TextInput
                                            value={step.instruction}
                                            onChangeText={(v) => updateInstruction(idx, "instruction", v)}
                                            multiline
                                            placeholder={t.add.instruction}
                                            className="text-warm-gray-600 text-base leading-relaxed min-h-[60px] mb-3"
                                        />
                                        <ImageUpload
                                            value={step.image_url}
                                            onChange={(url) => updateInstruction(idx, "image_url", url)}
                                            aspectRatio="video"
                                            label="Step Photo (Optional)"
                                            className="h-40"
                                        />
                                    </View>`
);

fs.writeFileSync(file, content);
console.log('done');
