;; Math util updated 2026-05-30T07:10:26Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u10)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
