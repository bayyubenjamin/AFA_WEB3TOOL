;; Math util updated 2026-05-28T08:35:27Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u6)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
