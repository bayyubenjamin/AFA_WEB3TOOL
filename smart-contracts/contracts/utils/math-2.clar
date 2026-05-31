;; Math util updated 2026-05-31T02:54:48Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u89)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
