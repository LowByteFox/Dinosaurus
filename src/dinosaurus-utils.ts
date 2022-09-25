export const fileExist = async (filename: string): Promise<boolean> => {
    try {
        await Deno.stat(filename);
        // successful, file or directory must exist
        return true;
    } catch {
        return false;
    }
};

export const randomStr = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}