const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getAddress = require(path.join(daoPath, "properties", "utils", "getAddress"));
const getPosition = require(path.join(daoPath, "properties", "utils", "getPosition"));
const getGeolocationCenter = require(path.join(daoPath, "properties", "utils", "getGeolocationCenter"));

const SERVICE_ID = process.env.SERVICE_ID;

module.exports = function (id, bounds, currency = 'EUR') {

    // get distance
    let centerMap = null;

    if (bounds.lat !== 0 && bounds.lng !== 0) {
        centerMap = `POINT(${bounds.lng}, ${bounds.lat})`;
    } else if (bounds.east !== 0 && bounds.north !== 0 && bounds.west !== 0 && bounds.south !== 0) {
        centerMap = getGeolocationCenter(bounds.east, bounds.north, bounds.west, bounds.south);
    }

    const DEGREES_TO_KILOMETRES = 111.325;
    let distance;
    if (centerMap) {
        distance = `ROUND((${centerMap} <-> rooms."position")::NUMERIC * ` + DEGREES_TO_KILOMETRES + ', 2) as distance';
    } else {
        distance = `0 as distance`;
    }

    const SQL_PROPERTY = `
        with rooms as (
            select rt.id, rt.name, rt.uri, rt."typeCode", rt.quantity, 
            json_build_object(
                'amount', (
                        CASE WHEN c."rate" IS NOT NULL
                        THEN rt.price * c."rate" 
                        ELSE rt.price 
                        END
                    ), 
                'currency', '${currency}', 
                'timeUnit', rt."timeUnit"
            ) AS price,
            rt.occupancy, rt."roomView", rt."bedTypes", rt."numberOfBeds", rooms.has_kitchen as kitchen, rooms.has_wifi as wifi, 
            coalesce ( 
                (select photos from SearchPhotoIndex where SearchPhotoIndex.roomtype_id=rt.id),
                (select photos from SearchPhotoIndex where SearchPhotoIndex.property_id=p.id and SearchPhotoIndex.roomtype_id isnull)
             ) as photos,									 
            rooms.amenities_list as amenities,
            service_options->$2->'is_highlight' as highlight,
            service_options->$2->'is_negotiated' as negotiated,
            ${distance},
            json_build_object(
                'id', p."id",
                'name', p."name",
                'address', json_build_object(
                    'country', p."country",
                    'city', p."city",
                    'addressLine', p."address",
                    'postalCode', p."postalCode"
            )) AS "property"
              from searchindex as rooms
              left join "RoomTypes" as rt on rt.id=rooms.roomtype_id 
              left join "Properties" as p on rooms.property_id=p.id 
		      LEFT JOIN "Currency" as c ON rooms.common_currency = c.initial AND c.target='${currency}'
             where rooms.property_id=$1
         )
        select p.id, p.name, p.uri,
               json_build_object('lng', p.position[0], 'lat', p.position[1]) AS "position",
               json_build_object(
                            'country', p."country",
                            'city', p."city",
                            'addressLine', p."address",
                            'postalCode', p."postalCode"
               ) as address,
               (select array_to_json(array_agg(rooms_data.*)) from rooms as rooms_data) as "roomTypes"
          from "Properties" as p
         where p.id=$1     
    `;

    return this.dao.selectOne(SQL_PROPERTY, [id, SERVICE_ID]);
};