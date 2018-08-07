module.exports = function () {
    const SQL = `
        with 
            data as (
                select "original", "translated", "language" from "Translate"
                )
        select json_build_object("language", array_to_json(array_agg(data.*))) as translate from data
        group by "language"
    `;

    return this.dao.select(SQL);
};
