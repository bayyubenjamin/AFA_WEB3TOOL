;; Math util updated 2026-05-29T09:37:53Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u18)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
