module.exports = function (input, fields) {

    let filters = [];
    if (Object.keys(input.filters).length > 0) {

        if (input.filters.confirmationNumber) {
            filters.push(`LOWER("Bookings"."confirmationNumber") LIKE LOWER('%${input.filters.confirmationNumber}%')`);
        }

        if (input.filters.requestTime) {
            filters.push(`date_part('year',"Bookings"."requestTime") = date_part('year', '${input.filters.requestTime}'::date)`);
            filters.push(`date_part('month',"Bookings"."requestTime") = date_part('month', '${input.filters.requestTime}'::date)`);
            filters.push(`date_part('day',"Bookings"."requestTime") = date_part('day', '${input.filters.requestTime}'::date)`);
        }

        if (input.filters.status) {
            filters.push(`"Bookings"."status" = '${input.filters.status}'`);
        }

        if (input.filters.guestName) {
            let guestName_parts = input.filters.guestName.split(' ');
            for (let i = 0; i < guestName_parts.length; i++) {
                filters.push(`( LOWER("Bookings"."guestFirstName") LIKE LOWER('%${guestName_parts[i]}%') 
                    OR LOWER("Bookings"."guestLastName") LIKE LOWER('%${guestName_parts[i]}%')
                    OR LOWER("Bookings"."acquirerFirstName") LIKE LOWER('%${guestName_parts[i]}%')
                    OR LOWER("Bookings"."acquirerLastName") LIKE LOWER('%${guestName_parts[i]}%')
                    )`);
            }
        }

        if (input.filters.guestPhone) {
            filters.push(`( LOWER("Bookings"."guestPhone") LIKE LOWER('%${input.filters.guestPhone}%')
             OR  LOWER("Bookings"."acquirerPhone") LIKE LOWER('%${input.filters.guestPhone}%') )`);
        }

        if (input.filters.company) {
            filters.push(`LOWER("Bookings"."company") LIKE LOWER('%${input.filters.company}%')`);
        }

        if (input.filters.guestEmail) {
            filters.push(`( LOWER("Bookings"."guestEmail") LIKE LOWER('%${input.filters.guestEmail}%')
             OR  LOWER("Bookings"."acquirerEmail") LIKE LOWER('%${input.filters.guestEmail}%') )`);
        }

        if (input.filters.dateBegin && !input.filters.dateEnd) {
            filters.push(`date_part('year',"Bookings"."dateBegin") = date_part('year', '${input.filters.dateBegin}'::date)`);
            filters.push(`date_part('month',"Bookings"."dateBegin") = date_part('month', '${input.filters.dateBegin}'::date)`);
            filters.push(`date_part('day',"Bookings"."dateBegin") = date_part('day', '${input.filters.dateBegin}'::date)`);
        }

        if (input.filters.dateEnd && !input.filters.dateBegin) {
            filters.push(`date_part('year',"Bookings"."dateEnd") = date_part('year', '${input.filters.dateEnd}'::date)`);
            filters.push(`date_part('month',"Bookings"."dateEnd") = date_part('month', '${input.filters.dateEnd}'::date)`);
            filters.push(`date_part('day',"Bookings"."dateEnd") = date_part('day', '${input.filters.dateEnd}'::date)`);
        }

        if (input.filters.dateEnd && input.filters.dateBegin) {
            filters.push(`"Bookings"."dateBegin" >= '${input.filters.dateBegin}'::date`);
            filters.push(`"Bookings"."dateBegin" < '${input.filters.dateEnd}'::date`);
            filters.push(`"Bookings"."dateEnd" > '${input.filters.dateBegin}'::date`);
            filters.push(`"Bookings"."dateEnd" <= '${input.filters.dateEnd}'::date`);
        }

        if (input.filters.lengthOfStay) {
            filters.push(`("Bookings"."dateEnd"::date - "Bookings"."dateBegin"::date) = '${input.filters.lengthOfStay}'`);
        }

        if (input.filters.propertyName) {
            filters.push(`LOWER("roomType" #>> '{property,name}') LIKE LOWER('%${input.filters.propertyName}%')`);
        }

        if (input.filters.propertyAddress) {
            let address_parts = input.filters.propertyAddress.split(' ');
            for (let i = 0; i < address_parts.length; i++) {
                filters.push(`( LOWER("roomType" #>> '{property,address,city}') LIKE LOWER('%${address_parts[i]}%') 
                    OR LOWER("roomType" #>> '{property,address,country}') LIKE LOWER('%${address_parts[i]}%')
                    OR LOWER("roomType" #>> '{property,address,postalCode}') LIKE LOWER('%${address_parts[i]}%')
                    OR LOWER("roomType" #>> '{property,address,addressLine}') LIKE LOWER('%${address_parts[i]}%')
                    )`);
            }
        }

        if (input.filters.totalPriceAmount) {
            filters.push(`"Bookings"."totalPriceAmount" = '${input.filters.totalPriceAmount}'`);
        }

    }

    let SQL = `
        SELECT "Bookings"."${fields.join('","Bookings"."')}"
        FROM "Bookings"
        WHERE "Bookings"."service_id"='${input.service_id}'
    `;

    if (filters.length > 0) {
        SQL += ' AND ' + filters.join(' AND ');
    }

    return this.dao.select(SQL);
};
