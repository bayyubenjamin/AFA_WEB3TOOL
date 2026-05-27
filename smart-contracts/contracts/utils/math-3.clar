;; Math util updated 2026-05-27T18:19:06Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u32)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
