;; Math util updated 2026-05-29T09:53:28Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u19)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
