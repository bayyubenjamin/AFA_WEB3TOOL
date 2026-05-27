;; Math util updated 2026-05-27T11:55:39Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u6)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
