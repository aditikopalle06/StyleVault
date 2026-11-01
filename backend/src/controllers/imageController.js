
const FormData = require('form-data');
const axios = require('axios');

async function removeImageBackground(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'Please upload an image.'
            });
        }

        const form = new FormData();

        form.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await axios.post(
            'http://127.0.0.1:8000/remove-background',
            form,
            {
                headers: form.getHeaders(),
                responseType: 'arraybuffer',
                timeout: 180000
            }
        );

        res.set('Content-Type', 'image/png');
        return res.status(200).send(Buffer.from(response.data));

    } catch (error) {
        console.error(
            'Background removal error:',
            error.response?.data || error.message
        );

        return res.status(502).json({
            error: 'Background removal failed. Please try again.'
        });
    }
}

module.exports = { removeImageBackground };
