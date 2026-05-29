;; Math util updated 2026-05-29T09:23:42Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u17)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
