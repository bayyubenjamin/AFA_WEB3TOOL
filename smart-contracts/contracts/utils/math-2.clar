;; Math util updated 2026-05-31T01:17:48Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u83)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
