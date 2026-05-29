;; Math util updated 2026-05-29T10:10:50Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u20)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
