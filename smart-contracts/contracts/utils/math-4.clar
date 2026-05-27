;; Math util updated 2026-05-27T15:04:40Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u19)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
