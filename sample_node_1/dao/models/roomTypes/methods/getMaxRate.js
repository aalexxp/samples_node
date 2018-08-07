module.exports = function (service_id, roomTypeId, currency) {
    const SQL = `SELECT (
        CASE 
        WHEN sr.max_rate IS NOT NULL
            THEN
                CASE 
                WHEN '${currency}'!='EUR'
                    THEN sr.max_rate * (SELECT rate FROM "Currency" WHERE "Currency".initial='EUR' AND "Currency".target='${currency}' LIMIT 1)
                ELSE sr.max_rate
                END
        ELSE
        	CASE
        	WHEN scr.max_rate IS NOT NULL
        		THEN
	        		CASE 
	                WHEN '${currency}'!='EUR'
	                    THEN scr.max_rate * (SELECT rate FROM "Currency" WHERE "Currency".initial='EUR' AND "Currency".target='${currency}' LIMIT 1)
	                ELSE scr.max_rate
	                END
        	ELSE 0
            END    
        END
        ) as max_rate, 
        sp.is_negotiated as negotiated 
        FROM "RoomTypes" rt
        LEFT JOIN "Properties" p ON rt.property=p.id
        LEFT JOIN "Countries" AS cn ON p.country=cn.name 
        LEFT JOIN "Cities" AS ct ON p.city=ct.name AND cn.id=ct.country_id
        LEFT JOIN "ServicesRates" AS sr ON sr.city_id=ct.id AND sr."service_id"='${service_id}'::uuid
        LEFT JOIN "ServicesCountriesRates" AS scr ON cn.id=scr.country_id AND scr."service_id"='${service_id}'::uuid
        LEFT JOIN "ServicesProperties" AS sp ON p.id=sp.property_id AND sp."service_id"='${service_id}'::uuid
        WHERE rt.id='${roomTypeId}'
    `;

    return this.dao.selectOne(SQL);
};
