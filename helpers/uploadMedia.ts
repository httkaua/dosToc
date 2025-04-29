interface IObjectWithMedia {
    src: string[];
    [key: string]: any;
  }
  
export default async (file: Express.Multer.File, objWithMedia: any): Promise<IObjectWithMedia> => {
    try {
        if (!file || !file.path) {
            throw new Error("Nenhum arquivo enviado ou caminho inválido.");
        }

        //console.log(`Arquivo recebido: ${file.filename}`);

        const imagePath = file.path.replace(/\\/g, "/");

        if (!Array.isArray(objWithMedia.src)) {
            objWithMedia.src = [];
        }

        objWithMedia.src.push(imagePath);

        //console.log(`Objeto após inserção da imagem:`, objWithMedia);

        return { ...objWithMedia };

    } catch (err) {
        throw new Error(`Erro ao salvar imagem: ${err.message}`);
    }
};
