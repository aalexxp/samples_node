const SQL =
`
CREATE OR REPLACE FUNCTION cluterize_on_fly(
    bounds box,
    k integer DEFAULT 10,
    "precision" int DEFAULT 100,
    maxloops integer DEFAULT 10)
RETURNS TABLE (
	center point,
	radius float,
	power int,
	property uuid,
	loops int,
	"meanError" float
) AS
$BODY$
DECLARE
    kv POINT[];
    kv2 POINT[];
    firstid uuid[];
    radiuses float[];
    base_radius float;
    base_center point;
    cluster_power int[];
    nextpoint POINT;
    mindistance float;
    mini int;
    minr float;
    distance float;
    id uuid;
    epsilon float;
    totalerror float;
    properties SCROLL CURSOR (area box) FOR SELECT "Properties"."id", "Properties"."position" FROM "Properties" WHERE "Properties"."position" <@ area;
BEGIN
    base_center := @@bounds;
    base_radius := base_center <-> bounds[0];
    epsilon := base_radius / "precision" * k;
    loops := 0;

    FOR i IN 1..k LOOP
        kv[i] := POINT(base_center[0] + RANDOM() * base_radius * 2 - base_radius, base_center[1] + RANDOM() * base_radius * 2 - base_radius);
    END LOOP;

    open properties(bounds);
    LOOP
    loops := loops + 1;
        FOR i IN 1..k LOOP
            IF loops > 1 AND cluster_power[i] = 0 THEN
                kv[i] := POINT(base_center[0] + RANDOM() * base_radius * 2 - base_radius, base_center[1] + RANDOM() * base_radius * 2 - base_radius);
            END IF;
            kv2[i] := kv[i];
            cluster_power[i] := 0;
            radiuses[i] := 0;
        END LOOP;
        MOVE FIRST FROM properties;
    	LOOP
	        FETCH NEXT FROM properties INTO id, nextpoint;
        	IF nextpoint IS NULL THEN EXIT;
        	END IF;
	            mindistance := base_radius;
	            mini := -1;
	            minr := base_radius;
        	FOR i IN 1..k LOOP
                distance := kv2[i] <-> nextpoint;
                IF distance < mindistance THEN
                    mini := i;
                    mindistance := distance;

                END IF;
            END LOOP;
            kv[mini] := POINT(((kv[mini])[0] * cluster_power[mini] + nextpoint[0])/(cluster_power[mini] + 1), ((kv[mini])[1] * cluster_power[mini] + nextpoint[1])/(cluster_power[mini] + 1));
            cluster_power[mini] := cluster_power[mini] + 1;
            radiuses[mini] := GREATEST(radiuses[mini], distance);
            firstid[mini] := id;
    	END LOOP;
    	totalerror = 0;
    	FOR i IN 1..k LOOP
            totalerror := totalerror + abs(kv2[i] <-> kv[i]);
        END LOOP;
        IF totalerror < epsilon OR loops >= maxloops THEN
            EXIT;
        END IF;
    END LOOP;
    close properties;

    "meanError" := totalerror / k;

    FOR i IN 1..k LOOP
        IF cluster_power[i] = 0 THEN
            continue;
        END IF;
        center := kv[i];
        radius := radiuses[i];
        power := cluster_power[i];
	IF cluster_power[i] > 1 THEN
	    property := NULL;
        ELSE
            property := firstid[i];
        END IF;
        RETURN NEXT;
    END LOOP;
    RETURN;
END;
$BODY$
LANGUAGE plpgsql STABLE
`;

exports.up = function (db) {
    return db.runSql(
        SQL
    );
};

exports.down = function (db) {
    return db.runSql(
        `DROP FUNCTION cluterize_on_fly(box, integer, integer, integer);`
    );
};
