# ACCAD Female1 Idle Candidates

Downloaded on 2026-03-27 from the official ACCAD / Open Motion Project page:

- Source page: https://accad.osu.edu/research/motion-lab/mocap-system-and-data
- Source archive: https://accad.osu.edu/sites/accad.osu.edu/files/Female1_bvh.zip
- License page linked by ACCAD: https://creativecommons.org/licenses/by/3.0/

Selected files extracted from `Female1_bvh.zip`:

- `female1_idle_candidates/Female1_A01_Stand.bvh`
- `female1_idle_candidates/Female1_A02_Sway.bvh`
- `female1_idle_candidates/Female1_D2_Wait.bvh`

Why these were selected:

- `Stand`: closest to a neutral idle start pose
- `Sway`: subtle body motion that can work as an idle variation
- `Wait`: the most obviously idle-adjacent loop candidate in the package

These are raw BVH source files. This repository does not currently load BVH directly; convert or retarget them before runtime use.
