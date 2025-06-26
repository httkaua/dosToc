interface IObjectWithMedia {
    media: string[];
    [key: string]: any;
}

export default async (file: Express.Multer.File, objWithMedia: any): Promise<IObjectWithMedia> => {
    try {
        if (!file || !file.path) {
            throw new Error("Nenhum arquivo enviado ou caminho inválido.");
        }

        //console.log(`Arquivo recebido: ${file.filename}`);

        const imagePath = file.filename.replace(/\\/g, "/");

        if (!Array.isArray(objWithMedia.media)) {
            objWithMedia.media = [];
        }

        objWithMedia.media.push(imagePath);

        //console.log(`Objeto após inserção da imagem:`, objWithMedia);

        return { ...objWithMedia };

    } catch (err) {
        const message =
            err instanceof Error ? err.message : String(err)

        console.error(`Erro ao salvar imagem: ${message}`)
        throw new Error(`Erro ao salvar imagem: ${message}`)
    }
};
