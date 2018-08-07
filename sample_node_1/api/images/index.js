const bodyParser = require('body-parser'),
    express = require('express'),
    router = express.Router(),
    rp = require("request-promise"),
    {URL} = require('url'),
    _ = require("lodash"),
    moment = require('moment'),
    fs = require('fs'),
    path = require('path');

module.exports = router;

router.use("/", [bodyParser.json({limit: '10mb'}), bodyParser.urlencoded({limit: '10mb', extended: true})]);

router.post('/check', checkImage);
router.post('/upload', uploadImage);

/**
 * Check image by URL
 * If a link get the 404 error an image will be mark as deleted.
 * @param req
 * @param res
 */
function checkImage(req, res) {
    let url = _.get(req.body, 'url', '');
    let clear_url = url.replace(/(http:\/\/)|(https:\/\/)|(\/\/)/mg, "");
    let url_url = new URL(`https://${clear_url}`);
    let search_url = [url_url.hostname, url_url.pathname].join('');

    if (search_url) {
        req.dao.photos.likeByUrl(search_url)
            .then(photos => {
                if (photos.length > 0) {
                    let check_url = `https:${photos[0].url}`;
                    rp({url: check_url, method: 'HEAD'})
                        .then(result => true)
                        .catch(error => {
                            if (error.statusCode === 404) {
                                let images_id = photos.map(photo => photo.id);
                                req.dao.photos.markAsDeleted(images_id);
                            }
                        });
                }
            });
    }

    res.json({});
}

function uploadImage(req, res) {
    const imageBuffer = decodeBase64Image(req.body.src);
    const ext = imageBuffer.type.split('/')[1];
    const fileName = `${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const todayDate = moment().format('DD-MM-YYYY');
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    const destinationDir = path.join(uploadsDir, todayDate);

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
    if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir);
    }
    fs.writeFile(path.join(destinationDir, fileName), imageBuffer.data, function (err) {
        if (err) {
            res.sendError(err)
        }

        res.json({
            success: true,
            url: `${process.env.FRONT_URL}/uploads/${todayDate}/${fileName}`
        });
    })
}

function decodeBase64Image(dataString) {
    const matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
}
