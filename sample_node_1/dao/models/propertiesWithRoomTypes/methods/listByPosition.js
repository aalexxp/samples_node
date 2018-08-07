const path = require("path");
const daoPath = path.join(__dirname, "..", "..");
const getGeolocationBounds = require(path.join(daoPath, "properties", "utils", "getGeolocationBounds"));
const getGeolocationCenter = require(path.join(daoPath, "properties", "utils", "getGeolocationCenter"));
const getPosition = require(path.join(daoPath, "properties", "utils", "getPosition"));
const util = require('util');
const _ = require('lodash');
const AMENITY_RULES = require("../../../../bin/index/amenities_rules").AMENITY_RULES;

const SERVICE_ID = process.env.SERVICE_ID;
const BOUNDS_LIMIT = 5;

const rankMethods = require("../utils/rankMethods.js").rankMethods;
const isAvailableSortMethod = require("../utils/rankMethods.js").isAvailableSortMethod;

whereBookingResource = (options) => {
    let SQL = ` AND (p.resource->>'DB'::text<>'BOOKING' OR resource ISNULL or resource='null')`;
    if (options.appendBookingData) {
        SQL = ` AND (p.resource->>'DB'::text='BOOKING' OR resource ISNULL or resource='null') `;
    }

    return SQL;
};

function prepareSortMethod(query) {
    // Default sort methods
    let sort_methods = ['P', 'D'];

    let extra_join = [];
    let rank_formula = [];

    if (query) {
        sort_methods = query.split(',');
    }

    // Validation for input parameters (v2)
    let conditions = [];
    sort_methods
        .map(method => method.toUpperCase())
        .forEach(method => {
            if (isAvailableSortMethod(method)) {
                conditions.push(rankMethods[method]);
            } else {
                console.warn('Sort method "' + method + '" unavialable!');
            }
            return conditions;
        });

    let sql_source = {
        select: [],
        from: [],
        where: []
    };

    conditions
        .filter(condition => condition.type === 'SEPARATE')
        .forEach(rankConditions => {
            rank_formula.push(rankConditions.rank_field);
            rankConditions.extend_query.forEach(condition => {
                for (let key in condition) {
                    if (sql_source[key].indexOf(condition[key]) === -1)
                        sql_source[key].push(condition[key]);
                }
            });
        });

    let group = conditions
        .filter(condition => condition.type === 'RATING_GROUP')
        .map(rankCondition => ["'", rankCondition.field, "'"].join(''));
    if (group.length) {
        rank_formula.push('group_index_data.value');
        extra_join.push(`left join group_index_resource as group_index_data on filtered_rooms.property_id=group_index_data.property`);
    }

    let order = ['ORDER BY rank_index'];
    if (rank_formula.length > 1) {
        if (rank_formula.indexOf(rankMethods.P.rank_field) !== -1) {
            let _rank_formula = [];
            rank_formula.forEach(rank => {
                if (rank !== rankMethods.P.rank_field) {
                    _rank_formula.push(rank);
                }
            });
            rank_formula = [_rank_formula.join('*'), rankMethods.P.rank_field].join('/') + ' as rank_index';
            order.push('DESC');
        } else {
            rank_formula = rank_formula.join('*') + ' as rank_index';
            order.push('DESC');
        }
    } else {
        if (rank_formula.indexOf(rankMethods.P.rank_field) !== -1) {
            order.push('ASC');
        } else {
            order.push('DESC');
        }
        rank_formula = rank_formula.join('*') + ' as rank_index';
    }

    const result = {
        rank_formula: rank_formula,
        order: order.join(' '),
        extra_join: extra_join,
        sort_group: group
    };

    return result;
}

module.exports = function (input, options = {}) {

    const APARTMENT_LIST_LIMIT = 16;

    // Validate parameters
    let currency, test_currency_options = input.currency.match(/([A-Z]{3})/mg);
    if (input.currency && test_currency_options.length > 0) {
        currency = test_currency_options[0];
    } else {
        currency = 'EUR';
    }

    // Filter by amenities (v2)
    let amenities = '';
    if (input.amenities) {
        //       amadeus: [12, 13, 25, 48, 100, 112],
        let AMENITIES_MAP = {
            'CF_INTERNET': {
                amadeus: [12, 13, 25, 48, 100, 112],
                booking: 'has_internet'
            },
            'CF_FITNESS': {
                amadeus: [],
                booking: 'has_fitness_center'
            },
            'CF_PETS': {
                amadeus: [36],
                booking: 'has_pets_allowed'
            },
            'CF_KITCHEN': {
                amadeus: [39],
                booking: 'has_kitchen'
            },
            'CF_PARKING': {
                amadeus: [68, 128, 5],
                booking: 'has_parking'
            },
            'CF_DISHWASHER': {
                amadeus: [],
                booking: 'has_dishwasher'
            },
            'CF_AIR': {
                amadeus: [24],
                booking: 'has_air'
            },
        };

        // Add amenities mapping from
        AMENITY_RULES.forEach(rule => {
            AMENITIES_MAP[rule.key] = {
                amadeus: [],
                booking: rule
            };
        });

        let _amenities = JSON.parse(input.amenities);
        let search_query = [];
        _amenities.forEach(param => {
            let search_query_parameter = [];

            if (AMENITIES_MAP[param]) {

                if (_.isString(AMENITIES_MAP[param]['booking'])) {
                    search_query_parameter.push(`(filter_index #>> '{filter, ${AMENITIES_MAP[param]['booking']}}')::bool is true`);
                }

                if (_.isObject(AMENITIES_MAP[param]['booking'])) {
                    let queries = AMENITIES_MAP[param]['booking'].query || [];
                    queries.forEach(query => {
                        search_query_parameter.push(`(room_amenities ~ ${query})`);
                    });
                }

                // Filter for amadeus data
                AMENITIES_MAP[param].amadeus.forEach(val => {
                    search_query_parameter.push(`amenities_list::jsonb @> '[${val}]'`);
                });
                search_query_parameter.push(`amenities_list::jsonb @> '[${AMENITIES_MAP[param].amadeus.join(',')}]'`);
            } else {
                search_query_parameter.push(`(room_amenities ~ '${param}')`);
            }

            search_query.push('(' + search_query_parameter.join(' OR ') + ')');

        });
        amenities = search_query.length > 0 ? [' and ', search_query.join(' and ')].join('') : '';
    }

    // Filter by price (v2)
    let filter_price = '';
    if (input.price) {
        let price = input.price.split(',');
        if (price.length === 2) {
            price[0] = parseInt(price[0]);
            price[1] = parseInt(price[1]);
            filter_price = ` AND common_price>${price[0]} AND common_price<${price[1]} `;
        }
    }

    // Filter by max_adults and max_children
    let filter_people = [];
    if (_.has(input, 'mad') && input.mad !== undefined) {
        filter_people.push(` AND max_adults >= ${input.mad} `)
    }
    if (_.has(input, 'mch') && input.mch !== undefined) {
        filter_people.push(` AND max_children >= ${input.mch} `)
    }
    filter_people = filter_people.join('');

    // Filter by livability index
    let filter_l_index = '';
    if (input.minLIndex && !isNaN(input.minLIndex)) {
        filter_l_index = ` AND livability_index >= ${input.minLIndex} `;
    }

    // Sort by distance (v2)
    // if not select distance sort method - set 0 as distance index - otherwise - calc distance
    let distance = '0 as distance_index';

    let centerMap;
    if (!input.lat || !input.lng) {
        centerMap = getGeolocationCenter(input.east, input.north, input.west, input.south);
    } else {
        centerMap = `POINT(${input.lng}, ${input.lat})`;
    }
    const DEGREES_TO_KILOMETRES = 111.325;
    let sort_methods = ['p', 'd'];
    if (input.sort) {
        sort_methods = input.sort.split(',');
    }
    let is_distance = sort_methods
        .map(method => method.toUpperCase())
        .filter(sort_method => sort_method === 'D');
    if (is_distance.length) {
        distance = `ROUND((${centerMap} <-> searchindex."position")::NUMERIC * ` + DEGREES_TO_KILOMETRES + ', 2) as distance_index';
    }

    let locationBounds = getGeolocationBounds(input.east, input.north, input.west, input.south);

    let SORT_CALC = prepareSortMethod(input.sort);

    // Check offset (v2)
    let query_offset = '';
    if (input.offset) {
        query_offset = ' OFFSET ' + input.offset;
    }

    const appendBookingData = input.east - input.west <= BOUNDS_LIMIT;


    let sortGroupWhere = '';
    if (SORT_CALC.sort_group.length) {
        sortGroupWhere = ` title in (${SORT_CALC.sort_group.join(',')}) AND `;
    }

    let query_v2 = `
    with
	rooms as (
		select searchindex.*, 
		${distance},
		coalesce(searchgroupindex.value,0) as group_index_value,
		(
            CASE WHEN "Currency"."rate" IS NOT NULL
            THEN searchindex.common_price * "Currency"."rate" 
            ELSE searchindex.common_price 
            END
		) as main_price,
		'${currency}' as main_currency
		from searchindex
		left join searchgroupindex on searchindex.property_id=searchgroupindex.property_id
		LEFT JOIN "Currency" ON searchindex.common_currency = "Currency".initial AND "Currency".target='${currency}'
		where 
		  ${locationBounds}  ${filter_people}
		  and (service_options is null or service_options #>> '{${SERVICE_ID},is_block}' <> 'true')
		  and room_amenities is not null
	),
	filtered_rooms as (
	    select * from rooms where true ${amenities} ${filter_price} ${filter_l_index} 	    
	),
	group_index_resource as (
		SELECT property, sum(value) as value
		  FROM "PropertyReviewScore" 
		 where ${sortGroupWhere} "PropertyReviewScore".property in (select property_id from rooms)
		 group by property
	),
	ordered_rooms as(
		select *,
  		       ${SORT_CALC.rank_formula}
	      from filtered_rooms
	     ${SORT_CALC.extra_join} 
	     ${SORT_CALC.order}
	     limit ${APARTMENT_LIST_LIMIT} ${query_offset}
	),
	price_bounds AS ( 
	    SELECT min(main_price) min_price, max(main_price) max_price 
          FROM rooms 
    ),
    properties_list as(
    	select p.id, p.name, p.uri, ${getPosition('position', 'p')}, ARRAY[]::integer[] as "roomTypes",
    	    coalesce(p.resource->>'DB','A') as resource,
            (select url from "Photos" where p.id="Photos".relation limit 1) as photo,
    	    (
                CASE WHEN "Currency"."rate" IS NOT NULL
                THEN spi."min_price" * "Currency"."rate" 
                ELSE spi."min_price"
                END
            ) as price,
		    '${currency}' as currency
    	from "Properties" as p
    	LEFT JOIN "searchpriceindex" as spi ON p.id = spi.property_id
    	LEFT JOIN "Currency" ON spi."currency" = "Currency".initial AND "Currency".target='${currency}'
    	where p.id in (select distinct(filtered_rooms.property_id) from filtered_rooms) ${whereBookingResource({appendBookingData: appendBookingData})}
    ),
    rooms_data as (
        select ordered_rooms.roomtype_id as id,
               "RoomTypes".name as name,
               "RoomTypes".uri as uri,
               "RoomTypes"."typeCode" as typeCode,
               "RoomTypes".quantity as quantity,
               json_build_object('amount', ordered_rooms.main_price, 'currency', ordered_rooms.main_currency, 'timeUnit', "RoomTypes"."timeUnit") as price,
               "RoomTypes".occupancy as occupancy,
               "RoomTypes"."roomView" as roomView,
               "RoomTypes"."bedTypes" as bedTypes,
               "RoomTypes"."numberOfBeds" as numberOfBeds,
               ordered_rooms.distance_index as distance,
               service_options->'${SERVICE_ID}'->'is_highlight' as highlight,
               service_options->'${SERVICE_ID}'->'is_negotiated' as negotiated,
               ordered_rooms.has_kitchen as kitchen,
               ordered_rooms.has_wifi as wifi,
               coalesce ( 
                        (select photos from SearchPhotoIndex where SearchPhotoIndex.roomtype_id=ordered_rooms.roomtype_id),
                        (select photos from SearchPhotoIndex where SearchPhotoIndex.property_id="Properties".id and roomtype_id isnull)
                     ) as photos,									 
               ordered_rooms.amenities_list as amenities,
               json_build_object('id', "Properties".id, 'name', "Properties".name, 'uri', "Properties".uri) as property
          from ordered_rooms
          left join "RoomTypes" on ordered_rooms.roomtype_id="RoomTypes".id
          left join "Properties" on ordered_rooms.property_id="Properties".id
     )   
     select (select row_to_json(price_bounds.*) from price_bounds) as price_bounds,
            (select array_to_json(array_agg(rooms_data.*)) from rooms_data) as results,
            coalesce((select array_to_json(array_agg(properties_list.*)) from properties_list),'[]') as map_properties
    `;

    return this.dao.selectOne(query_v2);

};

