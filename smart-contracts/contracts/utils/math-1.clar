;; Math util updated 2026-05-27T22:37:09Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u48)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
