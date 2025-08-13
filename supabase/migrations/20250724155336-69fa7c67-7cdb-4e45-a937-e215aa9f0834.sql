-- Add new Bing/Microsoft-style URL pattern
INSERT INTO public.url_patterns (
  pattern_name,
  pattern_template,
  category,
  content_type,
  base_success_rate,
  tier,
  usage_limits,
  metadata
) VALUES (
  'Bing Search Results',
  'https://{domain}/search?q={query}&qs={query_scope}&form={form_type}&sp={search_params}&pq={previous_query}&sc={search_context}&sk={search_key}&cvid={correlation_id}&data={encrypted}',
  'search',
  'text/html',
  92,
  1,
  '{"maxUses": 2000, "currentUses": 0}',
  '{
    "description": "Mimics Bing/Microsoft search result URLs with authentic parameters",
    "industry": "search_engine",
    "regional": false,
    "seasonal": false,
    "validation_required": ["q", "qs", "form", "sp", "pq", "sc", "sk", "cvid", "data"],
    "parameter_types": {
      "q": "search_query",
      "qs": "query_scope", 
      "form": "form_type",
      "sp": "search_params",
      "pq": "previous_query",
      "sc": "search_context", 
      "sk": "search_key",
      "cvid": "correlation_id",
      "data": "encrypted_payload"
    }
  }'
);