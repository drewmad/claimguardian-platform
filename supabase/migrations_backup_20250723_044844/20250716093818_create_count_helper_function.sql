CREATE OR REPLACE FUNCTION public.get_raw_data_counts_by_source()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(t)
    FROM (
      SELECT source, count(*) as record_count
      FROM external_raw_fl.property_data
      GROUP BY source
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
