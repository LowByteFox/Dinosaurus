export const fileExist = async (filename: string): Promise<boolean> => {
    try {
        await Deno.stat(filename);
        // successful, file or directory must exist
        return true;
    } catch {
        return false;
    }
};