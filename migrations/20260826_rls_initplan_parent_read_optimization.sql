alter policy "parent_link_read" on public.parent_students using (parent_profile_id = (select auth.uid()));

alter policy "parent_household_student_read2" on public.students using (
  household_id is not null
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'parent'
      and p.household_id = students.household_id
  )
);

alter policy "parent_linked_student_read" on public.students using (
  exists (
    select 1 from public.parent_students ps
    where ps.student_id = students.id
      and ps.parent_profile_id = (select auth.uid())
  )
);
