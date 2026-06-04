import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { classesService } from "./classes.service";

export const CLASS_KEYS = {
  all: ["classes"] as const,

  detail: (id: string) => ["class", id] as const,
};

export const useClasses = () => {
  return useQuery({
    queryKey: CLASS_KEYS.all,
    queryFn: classesService.getClasses,
  });
};

export const useClassDetail = (classId: string) => {
  return useQuery({
    queryKey: CLASS_KEYS.detail(classId),
    queryFn: () => classesService.getClassById(classId),
    enabled: !!classId,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesService.createClass,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CLASS_KEYS.all,
      });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesService.updateClass,
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({ queryKey: CLASS_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CLASS_KEYS.detail(variables.classId),
      });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classesService.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLASS_KEYS.all });
    },
  });
};
