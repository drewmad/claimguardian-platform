--
-- PostgreSQL database dump
--

-- Dumped from database version 14.9 (Ubuntu 14.9-1.pgdg20.04+1)
-- Dumped by pg_dump version 14.9 (Ubuntu 14.9-1.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


--
-- Name: flood_zone_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.flood_zone_type AS ENUM (
    'A',
    'AE',
    'AH',
    'AO',
    'AR',
    'A99',
    'V',
    'VE',
    'X',
    'B',
    'C',
    'D',
    'UNKNOWN'
);


ALTER TYPE public.flood_zone_type OWNER TO postgres;

--
-- Name: land_use_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.land_use_category AS ENUM (
    'residential',
    'commercial',
    'industrial',
    'agricultural',
    'vacant',
    'institutional',
    'recreational',
    'transportation',
    'utility',
    'other'
);


ALTER TYPE public.land_use_category OWNER TO postgres;

--
-- Name: calculate_centroid(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_centroid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.geom IS NOT NULL THEN
        NEW.centroid = ST_Centroid(NEW.geom);
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calculate_centroid() OWNER TO postgres;

--
-- Name: refresh_parcels_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.refresh_parcels_stats() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY florida_parcels_county_stats;
END;
$$;


ALTER FUNCTION public.refresh_parcels_stats() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: florida_parcels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.florida_parcels (
    parcel_id text NOT NULL,
    county text NOT NULL,
    state_parcel_id text,
    owner_name text,
    owner_address text,
    owner_city text,
    owner_state text,
    owner_zip text,
    property_address text,
    property_city text,
    property_zip text,
    municipality text,
    subdivision text,
    legal_description text,
    deed_book text,
    deed_page text,
    land_use_code text,
    land_use_category public.land_use_category,
    zoning text,
    acreage numeric(10,4),
    lot_size numeric(12,2),
    year_built integer,
    building_area numeric(10,2),
    living_area numeric(10,2),
    bedrooms integer,
    bathrooms numeric(3,1),
    stories integer,
    building_type text,
    construction_type text,
    roof_type text,
    exterior_wall text,
    assessed_value numeric(12,2),
    market_value numeric(12,2),
    land_value numeric(12,2),
    building_value numeric(12,2),
    total_value numeric(12,2),
    homestead_exempt boolean DEFAULT false,
    senior_exempt boolean DEFAULT false,
    veteran_exempt boolean DEFAULT false,
    disability_exempt boolean DEFAULT false,
    agricultural_exempt boolean DEFAULT false,
    assessment_year integer,
    tax_district text,
    school_district text,
    fire_district text,
    water_district text,
    sewer_district text,
    flood_zone text,
    flood_zone_type public.flood_zone_type,
    hurricane_zone text,
    evacuation_zone text,
    coastal_construction_line boolean DEFAULT false,
    last_sale_date date,
    last_sale_price numeric(12,2),
    previous_sale_date date,
    previous_sale_price numeric(12,2),
    geom public.geometry(Polygon,4326),
    centroid public.geometry(Point,4326),
    data_source text DEFAULT 'FDOT'::text,
    data_quality_score integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT positive_acreage CHECK ((acreage >= (0)::numeric)),
    CONSTRAINT positive_values CHECK (((((assessed_value >= (0)::numeric) AND (market_value >= (0)::numeric)) AND (land_value >= (0)::numeric)) AND (building_value >= (0)::numeric)) AND (total_value >= (0)::numeric)),
    CONSTRAINT valid_assessment_year CHECK (((assessment_year >= 1990) AND (assessment_year <= (EXTRACT(year FROM now()) + (1)::numeric)))),
    CONSTRAINT valid_year_built CHECK (((year_built >= 1700) AND (year_built <= (EXTRACT(year FROM now()) + (10)::numeric)))),
    CONSTRAINT florida_parcels_data_quality_score_check CHECK (((data_quality_score >= 0) AND (data_quality_score <= 100)))
);


ALTER TABLE public.florida_parcels OWNER TO postgres;

--
-- Name: TABLE florida_parcels; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.florida_parcels IS 'Florida property parcel data from FDOT with spatial and assessment information';


--
-- Name: COLUMN florida_parcels.parcel_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.parcel_id IS 'Unique identifier for the parcel';


--
-- Name: COLUMN florida_parcels.county; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.county IS 'County where the parcel is located';


--
-- Name: COLUMN florida_parcels.geom; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.geom IS 'Polygon geometry of the parcel boundary';


--
-- Name: COLUMN florida_parcels.centroid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.centroid IS 'Point geometry of the parcel centroid';


--
-- Name: COLUMN florida_parcels.assessed_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.assessed_value IS 'Current assessed value for tax purposes';


--
-- Name: COLUMN florida_parcels.market_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.market_value IS 'Estimated market value';


--
-- Name: COLUMN florida_parcels.flood_zone_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.flood_zone_type IS 'FEMA flood zone designation';


--
-- Name: COLUMN florida_parcels.homestead_exempt; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.homestead_exempt IS 'Whether the property has homestead exemption';


--
-- Name: COLUMN florida_parcels.data_quality_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.florida_parcels.data_quality_score IS 'Quality score from 0-100 based on data completeness';


--
-- Name: florida_parcels_county_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.florida_parcels_county_stats AS
 SELECT florida_parcels.county,
    count(*) AS total_parcels,
    count(DISTINCT florida_parcels.municipality) AS municipalities,
    avg(florida_parcels.assessed_value) AS avg_assessed_value,
    percentile_cont((0.5)::double precision) WITHIN GROUP (ORDER BY florida_parcels.assessed_value) AS median_assessed_value,
    sum(florida_parcels.assessed_value) AS total_assessed_value,
    sum(florida_parcels.acreage) AS total_acreage,
    count(*) FILTER (WHERE (florida_parcels.homestead_exempt = true)) AS homestead_parcels,
    count(*) FILTER (WHERE (florida_parcels.flood_zone_type = ANY (ARRAY['A'::public.flood_zone_type, 'AE'::public.flood_zone_type, 'V'::public.flood_zone_type, 'VE'::public.flood_zone_type]))) AS flood_zone_parcels,
    count(*) FILTER (WHERE (florida_parcels.assessed_value > (500000)::numeric)) AS high_value_parcels,
    count(*) FILTER (WHERE (florida_parcels.land_use_category = 'residential'::public.land_use_category)) AS residential_parcels,
    count(*) FILTER (WHERE (florida_parcels.land_use_category = 'commercial'::public.land_use_category)) AS commercial_parcels,
    count(*) FILTER (WHERE (florida_parcels.land_use_category = 'industrial'::public.land_use_category)) AS industrial_parcels,
    max(florida_parcels.updated_at) AS last_updated
   FROM public.florida_parcels
  GROUP BY florida_parcels.county
  WITH NO DATA;


ALTER TABLE public.florida_parcels_county_stats OWNER TO postgres;

--
-- Name: florida_parcels_flood_risk; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.florida_parcels_flood_risk AS
 SELECT florida_parcels.parcel_id,
    florida_parcels.county,
    florida_parcels.municipality,
    florida_parcels.property_address,
    florida_parcels.assessed_value,
    florida_parcels.flood_zone,
    florida_parcels.flood_zone_type,
    florida_parcels.hurricane_zone,
    florida_parcels.evacuation_zone,
    florida_parcels.coastal_construction_line,
    florida_parcels.geom
   FROM public.florida_parcels
  WHERE ((florida_parcels.flood_zone_type = ANY (ARRAY['A'::public.flood_zone_type, 'AE'::public.flood_zone_type, 'AH'::public.flood_zone_type, 'AO'::public.flood_zone_type, 'AR'::public.flood_zone_type, 'A99'::public.flood_zone_type, 'V'::public.flood_zone_type, 'VE'::public.flood_zone_type])) OR (florida_parcels.hurricane_zone IS NOT NULL) OR (florida_parcels.evacuation_zone IS NOT NULL) OR (florida_parcels.coastal_construction_line = true));


ALTER TABLE public.florida_parcels_flood_risk OWNER TO postgres;

--
-- Name: florida_parcels_high_value; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.florida_parcels_high_value AS
 SELECT florida_parcels.parcel_id,
    florida_parcels.county,
    florida_parcels.municipality,
    florida_parcels.owner_name,
    florida_parcels.property_address,
    florida_parcels.assessed_value,
    florida_parcels.market_value,
    florida_parcels.land_use_category,
    florida_parcels.year_built,
    florida_parcels.building_area,
    florida_parcels.acreage,
    florida_parcels.homestead_exempt,
    florida_parcels.flood_zone_type,
    florida_parcels.last_sale_date,
    florida_parcels.last_sale_price,
    florida_parcels.geom
   FROM public.florida_parcels
  WHERE (florida_parcels.assessed_value > (1000000)::numeric)
  ORDER BY florida_parcels.assessed_value DESC;


ALTER TABLE public.florida_parcels_high_value OWNER TO postgres;

--
-- Name: florida_parcels_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.florida_parcels_summary AS
 SELECT florida_parcels.county,
    count(*) AS parcel_count,
    count(DISTINCT florida_parcels.municipality) AS municipality_count,
    count(DISTINCT florida_parcels.subdivision) AS subdivision_count,
    avg(florida_parcels.assessed_value) AS avg_assessed_value,
    percentile_cont((0.5)::double precision) WITHIN GROUP (ORDER BY florida_parcels.assessed_value) AS median_assessed_value,
    min(florida_parcels.assessed_value) AS min_assessed_value,
    max(florida_parcels.assessed_value) AS max_assessed_value,
    sum(florida_parcels.assessed_value) AS total_assessed_value,
    avg(florida_parcels.acreage) AS avg_acreage,
    sum(florida_parcels.acreage) AS total_acreage,
    count(*) FILTER (WHERE (florida_parcels.homestead_exempt = true)) AS homestead_count,
    count(*) FILTER (WHERE (florida_parcels.flood_zone_type = ANY (ARRAY['A'::public.flood_zone_type, 'AE'::public.flood_zone_type, 'V'::public.flood_zone_type, 'VE'::public.flood_zone_type]))) AS flood_zone_count,
    avg((florida_parcels.year_built)::numeric) FILTER (WHERE (florida_parcels.year_built > 0)) AS avg_year_built,
    count(DISTINCT florida_parcels.land_use_category) AS land_use_categories
   FROM public.florida_parcels
  GROUP BY florida_parcels.county;


ALTER TABLE public.florida_parcels_summary OWNER TO postgres;

--
-- Name: florida_parcels florida_parcels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.florida_parcels
    ADD CONSTRAINT florida_parcels_pkey PRIMARY KEY (parcel_id);


--
-- Name: florida_parcels_county_stats_county_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX florida_parcels_county_stats_county_idx ON public.florida_parcels_county_stats USING btree (county);


--
-- Name: idx_florida_parcels_assessed_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_assessed_value ON public.florida_parcels USING btree (assessed_value);


--
-- Name: idx_florida_parcels_centroid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_centroid ON public.florida_parcels USING gist (centroid);


--
-- Name: idx_florida_parcels_county; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_county ON public.florida_parcels USING btree (county);


--
-- Name: idx_florida_parcels_county_land_use; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_county_land_use ON public.florida_parcels USING btree (county, land_use_category);


--
-- Name: idx_florida_parcels_county_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_county_value ON public.florida_parcels USING btree (county, assessed_value);


--
-- Name: idx_florida_parcels_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_created_at ON public.florida_parcels USING btree (created_at);


--
-- Name: idx_florida_parcels_evacuation_zone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_evacuation_zone ON public.florida_parcels USING btree (evacuation_zone);


--
-- Name: idx_florida_parcels_flood_zone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_flood_zone ON public.florida_parcels USING btree (flood_zone);


--
-- Name: idx_florida_parcels_flood_zone_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_flood_zone_type ON public.florida_parcels USING btree (flood_zone_type);


--
-- Name: idx_florida_parcels_flood_zone_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_flood_zone_value ON public.florida_parcels USING btree (flood_zone_type, assessed_value);


--
-- Name: idx_florida_parcels_flood_zones; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_flood_zones ON public.florida_parcels USING btree (county, municipality, assessed_value) WHERE (flood_zone_type = ANY (ARRAY['A'::public.flood_zone_type, 'AE'::public.flood_zone_type, 'V'::public.flood_zone_type, 'VE'::public.flood_zone_type]));


--
-- Name: idx_florida_parcels_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_geom ON public.florida_parcels USING gist (geom);


--
-- Name: idx_florida_parcels_high_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_high_value ON public.florida_parcels USING btree (county, municipality) WHERE (assessed_value > (500000)::numeric);


--
-- Name: idx_florida_parcels_homestead_exempt; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_homestead_exempt ON public.florida_parcels USING btree (homestead_exempt);


--
-- Name: idx_florida_parcels_homestead_true; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_homestead_true ON public.florida_parcels USING btree (county, assessed_value) WHERE (homestead_exempt = true);


--
-- Name: idx_florida_parcels_hurricane_zone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_hurricane_zone ON public.florida_parcels USING btree (hurricane_zone);


--
-- Name: idx_florida_parcels_land_use_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_land_use_category ON public.florida_parcels USING btree (land_use_category);


--
-- Name: idx_florida_parcels_land_use_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_land_use_code ON public.florida_parcels USING btree (land_use_code);


--
-- Name: idx_florida_parcels_last_sale_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_last_sale_date ON public.florida_parcels USING btree (last_sale_date);


--
-- Name: idx_florida_parcels_market_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_market_value ON public.florida_parcels USING btree (market_value);


--
-- Name: idx_florida_parcels_municipality; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_municipality ON public.florida_parcels USING btree (municipality);


--
-- Name: idx_florida_parcels_municipality_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_municipality_value ON public.florida_parcels USING btree (municipality, assessed_value);


--
-- Name: idx_florida_parcels_owner_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_owner_name ON public.florida_parcels USING btree (owner_name);


--
-- Name: idx_florida_parcels_property_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_property_address ON public.florida_parcels USING btree (property_address);


--
-- Name: idx_florida_parcels_school_district; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_school_district ON public.florida_parcels USING btree (school_district);


--
-- Name: idx_florida_parcels_subdivision; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_subdivision ON public.florida_parcels USING btree (subdivision);


--
-- Name: idx_florida_parcels_tax_district; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_tax_district ON public.florida_parcels USING btree (tax_district);


--
-- Name: idx_florida_parcels_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_updated_at ON public.florida_parcels USING btree (updated_at);


--
-- Name: idx_florida_parcels_year_built; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_year_built ON public.florida_parcels USING btree (year_built);


--
-- Name: idx_florida_parcels_zoning; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_florida_parcels_zoning ON public.florida_parcels USING btree (zoning);


--
-- Name: florida_parcels calculate_parcel_centroid; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER calculate_parcel_centroid BEFORE INSERT OR UPDATE ON public.florida_parcels FOR EACH ROW EXECUTE FUNCTION public.calculate_centroid();


--
-- Name: florida_parcels update_florida_parcels_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_florida_parcels_updated_at BEFORE UPDATE ON public.florida_parcels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- PostgreSQL database dump complete
--