update songs
set owner_user_id = 'b38f9272-ed74-4fd5-ac7f-aa0ca47427aa'::uuid
where slug = 'rihanna-stay-practice'
  and owner_user_id is null;
