module.exports = function (relation, language = "'EN'", field = 'photos', types, options = {}) {
    if (options && options.resource === 'INDEX') {
        return `
            (
                coalesce (
                    (select photos from SearchPhotoIndex where SearchPhotoIndex.roomtype_id="RoomTypes"."id"),
                    (select photos from SearchPhotoIndex where SearchPhotoIndex.property_id=${relation} and roomtype_id isnull)
                )    
            ) as "${field}"        
        `;
    } else {
        return `
            (
                    SELECT array_to_json(array_agg(row))
                    FROM
                    (
                        SELECT "Photos"."url", COALESCE("Photos"."title", MAX("TextDescriptions"."title")) as "title", MAX("TextDescriptions"."text") as "text", COALESCE("Photos"."type", MAX("TextDescriptions"."type")) as "type"
                        FROM "Photos"
                        LEFT JOIN "TextDescriptions" ON
                            COALESCE("Photos"."masterImage", "Photos"."id") = "TextDescriptions"."relation"
                                AND "TextDescriptions"."language" ~* ${language}
                        WHERE "Photos"."relation" = ${relation} AND "Photos"."original" 
                            ${types && types.length ? `AND "Photos"."type" IN ('${types.join("','")}')` : ``}
                        GROUP BY "Photos"."id", "TextDescriptions"."relation"
                        ORDER BY "Photos"."id"
                    ) AS row
                ) as "${field}"
            `;
    }
};